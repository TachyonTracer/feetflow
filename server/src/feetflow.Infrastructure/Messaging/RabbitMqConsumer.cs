using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using feetflow.Application.Interfaces;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace feetflow.Infrastructure.Messaging;

public class RabbitMqConsumer : IMessageConsumer, IAsyncDisposable
{
    private readonly ILogger<RabbitMqConsumer> _logger;
    private readonly IConfiguration _configuration;
    private IConnection? _connection;
    private IChannel? _channel;

    public RabbitMqConsumer(ILogger<RabbitMqConsumer> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task StartConsumingAsync(string queue, Func<string, Task> onMessage, CancellationToken cancellationToken = default)
    {
        await EnsureConnectionAsync(cancellationToken);

        if (_channel is null)
        {
            _logger.LogWarning("RabbitMQ channel is not available. Consumer not started");
            return;
        }

        await _channel.QueueDeclareAsync(queue, durable: true, exclusive: false, autoDelete: false, cancellationToken: cancellationToken);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            var body = Encoding.UTF8.GetString(ea.Body.ToArray());
            try
            {
                await onMessage(body);
                await _channel.BasicAckAsync(ea.DeliveryTag, false, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message from queue {Queue}", queue);
                await _channel.BasicNackAsync(ea.DeliveryTag, false, true, cancellationToken);
            }
        };

        await _channel.BasicConsumeAsync(queue, autoAck: false, consumer, cancellationToken);
        _logger.LogInformation("Started consuming from queue {Queue}", queue);
    }

    private async Task EnsureConnectionAsync(CancellationToken cancellationToken)
    {
        if (_connection is { IsOpen: true })
            return;

        try
        {
            var factory = new ConnectionFactory
            {
                HostName = _configuration["RabbitMq:HostName"] ?? "localhost",
                Port = int.Parse(_configuration["RabbitMq:Port"] ?? "5672"),
                UserName = _configuration["RabbitMq:UserName"] ?? "guest",
                Password = _configuration["RabbitMq:Password"] ?? "guest"
            };

            _connection = await factory.CreateConnectionAsync(cancellationToken);
            _channel = await _connection.CreateChannelAsync(cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to connect to RabbitMQ. Consumer will be unavailable");
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null) await _channel.DisposeAsync();
        if (_connection is not null) await _connection.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
