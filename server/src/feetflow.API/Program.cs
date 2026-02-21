using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using feetflow.Application;
using feetflow.Application.Helpers;
using feetflow.Infrastructure;
using feetflow.Infrastructure.Notifications;
using feetflow.Infrastructure.Persistence;
using feetflow.API.Auth;
using feetflow.API.Middleware;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

// --- Serilog ---
var logPath = Path.Combine(AppContext.BaseDirectory, "feetflowLogs");
builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithProperty("Application", "feetflow")
        .WriteTo.Console()
        .WriteTo.Logger(lc => lc
            .Filter.ByIncludingOnly(e => e.Properties.ContainsKey("SourceContext")
                && e.Properties["SourceContext"].ToString().Contains("RequestLog"))
            .WriteTo.File(
                Path.Combine(logPath, "{Date}", "requests.log"),
                rollingInterval: RollingInterval.Day,
                fileSizeLimitBytes: 10_485_760,
                rollOnFileSizeLimit: true,
                retainedFileCountLimit: null))
        .WriteTo.Logger(lc => lc
            .Filter.ByIncludingOnly(e => e.Level >= LogEventLevel.Error)
            .WriteTo.File(
                Path.Combine(logPath, "{Date}", "errors.log"),
                rollingInterval: RollingInterval.Day,
                fileSizeLimitBytes: 10_485_760,
                rollOnFileSizeLimit: true,
                retainedFileCountLimit: null))
        .WriteTo.Logger(lc => lc
            .Filter.ByIncludingOnly(e => e.Properties.ContainsKey("SourceContext")
                && e.Properties["SourceContext"].ToString().Contains("QueryLog"))
            .WriteTo.File(
                Path.Combine(logPath, "{Date}", "queries.log"),
                rollingInterval: RollingInterval.Day,
                fileSizeLimitBytes: 10_485_760,
                rollOnFileSizeLimit: true,
                retainedFileCountLimit: null));
});

// --- Application + Infrastructure DI ---
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddSingleton<GlobalHelper>();

// --- JWT Authentication ---
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException("JWT SecretKey not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };

    // Allow SignalR to receive the JWT via query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();
builder.Services.AddScoped<TokenService>();

// --- Rate Limiting ---
var rateLimitConfig = builder.Configuration.GetSection("RateLimiting");
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("fixed", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = int.Parse(rateLimitConfig["PermitLimit"] ?? "100"),
                Window = TimeSpan.FromSeconds(int.Parse(rateLimitConfig["WindowSeconds"] ?? "60"))
            }));
});

// --- CORS ---
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment() || corsOrigins.Length == 0)
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        }
    });
});

// --- Health Checks ---
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection") ?? "", name: "postgresql")
    .AddRabbitMQ(async sp =>
    {
        var config = sp.GetRequiredService<IConfiguration>();
        var factory = new RabbitMQ.Client.ConnectionFactory
        {
            HostName = config["RabbitMq:HostName"] ?? "localhost",
            Port = int.Parse(config["RabbitMq:Port"] ?? "5672"),
            UserName = config["RabbitMq:UserName"] ?? "guest",
            Password = config["RabbitMq:Password"] ?? "guest"
        };
        return await factory.CreateConnectionAsync();
    }, name: "rabbitmq");

// --- SignalR ---
builder.Services.AddSignalR();

// --- Controllers + Swagger ---
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- Initialize Database ---
using (var scope = app.Services.CreateScope())
{
    var dbInitializer = scope.ServiceProvider.GetRequiredService<DatabaseInitializer>();
    await dbInitializer.InitializeAsync();
}

// --- Middleware Pipeline ---
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSerilogRequestLogging();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers().RequireRateLimiting("fixed");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHealthChecks("/health");

await app.RunAsync();
