namespace feetflow.Application.Interfaces;

public interface IMessageConsumer
{
    Task StartConsumingAsync(string queue, Func<string, Task> onMessage, CancellationToken cancellationToken = default);
}
