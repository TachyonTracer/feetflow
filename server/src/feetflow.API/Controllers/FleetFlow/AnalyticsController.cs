using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Analytics;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : FleetControllerBase
{
    private readonly IMediator _mediator;

    public AnalyticsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new DashboardQuery(), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpGet("vehicle-roi/{vehicleId:guid}")]
    public async Task<IActionResult> GetVehicleRoi(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new VehicleRoiQuery(vehicleId), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpGet("fuel-efficiency/{vehicleId:guid}")]
    public async Task<IActionResult> GetFuelEfficiency(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new FuelEfficiencyQuery(vehicleId), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpGet("fleet-financial-summary")]
    public async Task<IActionResult> GetFleetFinancialSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetFleetFinancialSummaryQuery(startDate, endDate), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpGet("fuel-efficiency-trend")]
    public async Task<IActionResult> GetFuelEfficiencyTrend([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetFuelEfficiencyTrendQuery(startDate, endDate), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpGet("top-costliest-vehicles")]
    public async Task<IActionResult> GetTopCostliestVehicles([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetTopCostliestVehiclesQuery(startDate, endDate), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }
}
