using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Fuel;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/fuel")]
[Authorize]
public class FuelController : ControllerBase
{
    private readonly IMediator _mediator;

    public FuelController(IMediator mediator) => _mediator = mediator;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFuelLogRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CreateFuelLogCommand(request.VehicleId, request.TripId, request.Liters, request.Cost, request.FuelDate), cancellationToken);
        if (!result.IsSuccess) return StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
        return CreatedAtAction(nameof(Create), new { id = result.Value!.Id }, result.Value);
    }

    [HttpGet]
    public async Task<IActionResult> GetByVehicle([FromQuery] Guid vehicleId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetFuelLogsPagedQuery(vehicleId, pageNumber, pageSize), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }
}

public record CreateFuelLogRequest(Guid VehicleId, Guid? TripId, decimal Liters, decimal Cost, DateOnly FuelDate);
