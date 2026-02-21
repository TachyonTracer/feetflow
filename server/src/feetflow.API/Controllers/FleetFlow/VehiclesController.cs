using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Vehicles;
using feetflow.Domain.Common;
using feetflow.Domain.Enums;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiclesController : ControllerBase
{
    private readonly IMediator _mediator;

    public VehiclesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetVehicles([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] VehicleStatus? status = null, [FromQuery] bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetVehiclesQuery(pageNumber, pageSize, status, includeDeleted), cancellationToken);
        return ToActionResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetVehicleByIdQuery(id), cancellationToken);
        return ToActionResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CreateVehicleCommand(
            request.Name, request.LicensePlate, request.VehicleType, request.MaxCapacityKg, request.AcquisitionCost, request.OdometerKm), cancellationToken);
        if (!result.IsSuccess)
            return StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new UpdateVehicleCommand(
            id, request.Name, request.LicensePlate, request.VehicleType, request.MaxCapacityKg, request.OdometerKm, request.AcquisitionCost, request.Xmin), cancellationToken);
        return ToActionResult(result);
    }

    [HttpPatch("{id:guid}/retire")]
    public async Task<IActionResult> Retire(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new RetireVehicleCommand(id), cancellationToken);
        return ToActionResult(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new DeleteVehicleCommand(id), cancellationToken);
        return ToActionResult(result);
    }

    private IActionResult ToActionResult<T>(Result<T> result)
    {
        if (result.IsSuccess)
            return result.StatusCode == 201 ? StatusCode(201, result.Value) : Ok(result.Value);
        return StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }
}

public record CreateVehicleRequest(string Name, string LicensePlate, string VehicleType, decimal MaxCapacityKg, decimal AcquisitionCost, decimal OdometerKm = 0);
public record UpdateVehicleRequest(string Name, string LicensePlate, string VehicleType, decimal MaxCapacityKg, decimal OdometerKm, decimal AcquisitionCost, uint Xmin);
