using Microsoft.Extensions.DependencyInjection;
using FluentValidation;

namespace feetflow.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddMediatR(config =>
        {
            config.RegisterServicesFromAssembly(assembly);
            config.AddOpenBehavior(typeof(Common.Behaviors.ValidationBehavior<,>));
            config.AddOpenBehavior(typeof(Common.Behaviors.LoggingBehavior<,>));
        });

        services.AddValidatorsFromAssembly(assembly);

        return services;
    }
}
