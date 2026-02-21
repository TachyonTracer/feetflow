using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using feetflow.Application.Features.FleetFlow.Drivers;

namespace feetflow.API.Controllers.FleetFlow;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DriversController : ControllerBase
{
    private readonly IMediator _mediator;

    public DriversController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetDrivers([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetDriversPagedQuery(pageNumber, pageSize, includeDeleted), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDriverRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new CreateDriverCommand(
            request.FullName, request.LicenseNumber, request.LicenseCategory, request.LicenseExpiry), cancellationToken);
        if (!result.IsSuccess) return StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
        return CreatedAtAction(nameof(Create), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDriverRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new UpdateDriverCommand(
            id, request.FullName, request.LicenseNumber, request.LicenseCategory, request.LicenseExpiry, request.Xmin), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }

    [HttpPatch("{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new SuspendDriverCommand(id), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : StatusCode(result.StatusCode, new ProblemDetails { Status = result.StatusCode, Detail = result.Error });
    }
}

public record CreateDriverRequest(string FullName, string LicenseNumber, string LicenseCategory, DateOnly LicenseExpiry);
public record UpdateDriverRequest(string FullName, string LicenseNumber, string LicenseCategory, DateOnly LicenseExpiry, uint Xmin);
