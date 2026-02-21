using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using feetflow.Application.Interfaces;

namespace feetflow.Infrastructure.Notifications;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IHubContext<NotificationHub> hubContext, ILogger<NotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendToAllAsync(string method, object message, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.All.SendAsync(method, message, cancellationToken);
        _logger.LogInformation("Sent notification to all clients: {Method}", method);
    }

    public async Task SendToUserAsync(string userId, string method, object message, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.User(userId).SendAsync(method, message, cancellationToken);
        _logger.LogInformation("Sent notification to user {UserId}: {Method}", userId, method);
    }

    public async Task SendToGroupAsync(string group, string method, object message, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.Group(group).SendAsync(method, message, cancellationToken);
        _logger.LogInformation("Sent notification to group {Group}: {Method}", group, method);
    }
}
