using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Trips;
using feetflow.Domain.Enums;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TripsController : FleetControllerBase
{
    private readonly IMediator _mediator;

    public TripsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetTrips([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] TripStatus? status = null, [FromQuery] Guid? vehicleId = null, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetTripsQuery(pageNumber, pageSize, status, vehicleId), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTripRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CreateTripCommand(request.VehicleId, request.DriverId, request.CargoWeightKg, request.OriginState, request.DestinationState), cancellationToken);
        if (!result.IsSuccess) return ToActionResult(result);
        return CreatedAtAction(nameof(Create), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPatch("{id:guid}/dispatch")]
    public async Task<IActionResult> Dispatch(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new DispatchTripCommand(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpPatch("{id:guid}/complete")]
    public async Task<IActionResult> Complete(Guid id, [FromBody] CompleteTripRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CompleteTripCommand(id, request.EndOdometer, request.Revenue), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpPatch("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CancelTripCommand(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }
}

public record CreateTripRequest(Guid VehicleId, Guid DriverId, decimal CargoWeightKg, string OriginState, string DestinationState);
public record CompleteTripRequest(decimal EndOdometer, decimal Revenue);
