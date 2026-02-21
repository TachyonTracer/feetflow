using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Drivers;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DriversController : FleetControllerBase
{
    private readonly IMediator _mediator;

    public DriversController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetDrivers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetDriversPagedQuery(pageNumber, pageSize, includeDeleted), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDriverRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CreateDriverCommand(
            request.FullName, request.LicenseNumber, request.LicenseCategory, request.LicenseExpiry, request.CompletionRate, request.SafetyScore, request.Complaints), cancellationToken);
        if (!result.IsSuccess) return ToActionResult(result);
        return CreatedAtAction(nameof(Create), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDriverRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new UpdateDriverCommand(
            id, request.FullName, request.LicenseNumber, request.LicenseCategory, request.LicenseExpiry, request.CompletionRate, request.SafetyScore, request.Complaints, request.Xmin), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }

    [HttpPatch("{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new SuspendDriverCommand(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : ToActionResult(result);
    }
}

public record CreateDriverRequest(string FullName, string LicenseNumber, string LicenseCategory, DateOnly LicenseExpiry, decimal CompletionRate = 100.00m, decimal SafetyScore = 100.00m, int Complaints = 0);
public record UpdateDriverRequest(string FullName, string LicenseNumber, string LicenseCategory, DateOnly LicenseExpiry, decimal CompletionRate, decimal SafetyScore, int Complaints, uint Xmin);
