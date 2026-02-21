using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Fuel;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/fuel")]
[Authorize]
public class FuelController : FleetControllerBase
{
    private readonly IMediator _mediator;

    public FuelController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] GetFuelLogsRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetFuelLogsPagedQuery(request.VehicleId, request.PageNumber, request.PageSize), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFuelLogRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CreateFuelLogCommand(
            request.VehicleId, 
            request.TripId, 
            request.DriverId,
            request.Liters, 
            request.Cost, 
            request.Distance,
            request.MiscExpense,
            request.Status ?? "Completed",
            request.FuelDate), cancellationToken);
        
        if (!result.IsSuccess) return ToActionResult(result);
        return CreatedAtAction(nameof(Create), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateFuelLogRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new UpdateFuelLogCommand(
            id, 
            request.VehicleId, 
            request.TripId, 
            request.DriverId,
            request.Liters, 
            request.Cost, 
            request.Distance,
            request.MiscExpense,
            request.Status ?? "Completed",
            request.FuelDate), cancellationToken);
            
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }
}

public record CreateFuelLogRequest(
    Guid VehicleId, 
    Guid? TripId, 
    Guid? DriverId,
    decimal Liters, 
    decimal Cost, 
    decimal Distance,
    decimal MiscExpense,
    string? Status,
    DateOnly FuelDate);

public record UpdateFuelLogRequest(
    Guid VehicleId, 
    Guid? TripId, 
    Guid? DriverId,
    decimal Liters, 
    decimal Cost, 
    decimal Distance,
    decimal MiscExpense,
    string? Status,
    DateOnly FuelDate);

public record GetFuelLogsRequest(Guid? VehicleId, int PageNumber = 1, int PageSize = 10);
