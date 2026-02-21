using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Analytics;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AnalyticsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new DashboardQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }

    [HttpGet("vehicle-roi/{vehicleId:guid}")]
    public async Task<IActionResult> GetVehicleRoi(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new VehicleRoiQuery(vehicleId), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }

    [HttpGet("fuel-efficiency/{vehicleId:guid}")]
    public async Task<IActionResult> GetFuelEfficiency(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new FuelEfficiencyQuery(vehicleId), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }
}
