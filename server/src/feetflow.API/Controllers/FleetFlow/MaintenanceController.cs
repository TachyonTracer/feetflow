using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Maintenance;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/maintenance")]
[Authorize]
public class MaintenanceController : ControllerBase
{
    private readonly IMediator _mediator;

    public MaintenanceController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] bool? isClosed = null, [FromQuery] Guid? vehicleId = null, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetMaintenanceLogsQuery(pageNumber, pageSize, isClosed, vehicleId), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMaintenanceRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CreateMaintenanceCommand(request.VehicleId, request.Description, request.Cost, request.ServiceDate), cancellationToken);
        if (!result.IsSuccess) return StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
        return CreatedAtAction(nameof(Create), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPatch("{id:guid}/close")]
    public async Task<IActionResult> Close(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CloseMaintenanceCommand(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }
}

public record CreateMaintenanceRequest(Guid VehicleId, string Description, decimal Cost, DateOnly ServiceDate);
