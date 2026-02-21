namespace feetflow.Application.Interfaces;

public interface INotificationService
{
    Task SendToAllAsync(string method, object message, CancellationToken cancellationToken = default);
    Task SendToUserAsync(string userId, string method, object message, CancellationToken cancellationToken = default);
    Task SendToGroupAsync(string group, string method, object message, CancellationToken cancellationToken = default);
}
