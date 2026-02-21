using feetflow.Application.Interfaces;

namespace feetflow.Infrastructure.Messaging;

public class NullMessageConsumer : IMessageConsumer
{
    public Task StartConsumingAsync(string queue, Func<string, Task> onMessage, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
