using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Trips;
using feetflow.Domain.Enums;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TripsController : ControllerBase
{
    private readonly IMediator _mediator;

    public TripsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetTrips([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] TripStatus? status = null, [FromQuery] Guid? vehicleId = null, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetTripsQuery(page, pageSize, status, vehicleId), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTripRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CreateTripCommand(request.VehicleId, request.DriverId, request.CargoWeightKg), cancellationToken);
        if (!result.IsSuccess) return StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
        return CreatedAtAction(nameof(Create), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPatch("{id:guid}/dispatch")]
    public async Task<IActionResult> Dispatch(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new DispatchTripCommand(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }

    [HttpPatch("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, [FromBody] CompleteTripRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CompleteTripCommand(id, request.EndOdometer, request.Revenue), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }

    [HttpPatch("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CancelTripCommand(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }
}

public record CreateTripRequest(Guid VehicleId, Guid DriverId, decimal CargoWeightKg);
public record CompleteTripRequest(decimal EndOdometer, decimal Revenue);
