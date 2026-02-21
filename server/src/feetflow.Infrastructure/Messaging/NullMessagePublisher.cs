using feetflow.Application.Interfaces;

namespace feetflow.Infrastructure.Messaging;

public class NullMessagePublisher : IMessagePublisher
{
    public Task PublishAsync<T>(string exchange, string routingKey, T message, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
