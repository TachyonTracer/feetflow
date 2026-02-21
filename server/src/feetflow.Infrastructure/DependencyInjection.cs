using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using feetflow.Application.Interfaces;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;
using feetflow.Infrastructure.Messaging;
using feetflow.Infrastructure.Notifications;
using feetflow.Infrastructure.Persistence;
using feetflow.Infrastructure.Repositories;

namespace feetflow.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IDbConnectionFactory>(_ =>
            new DbConnectionFactory(configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not configured.")));

        services.AddScoped<IRepository<SampleEntity>, SampleRepository>();

        // FleetFlow
        services.AddScoped<IUnitOfWork, feetflow.Infrastructure.FleetFlow.UnitOfWork>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IVehicleRepository, VehicleRepository>();
        services.AddScoped<IDriverRepository, DriverRepository>();
        services.AddScoped<ITripRepository, TripRepository>();
        services.AddScoped<IMaintenanceLogRepository, MaintenanceLogRepository>();
        services.AddScoped<IFuelLogRepository, FuelLogRepository>();
        services.AddScoped<IAnalyticsRepository, AnalyticsRepository>();

        services.AddSingleton<IMessagePublisher, RabbitMqPublisher>();
        services.AddSingleton<IMessageConsumer, RabbitMqConsumer>();

        services.AddScoped<INotificationService, NotificationService>();

        services.AddSingleton<DatabaseInitializer>();

        return services;
    }
}
