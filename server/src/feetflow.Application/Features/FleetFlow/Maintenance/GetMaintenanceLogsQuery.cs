using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;
using feetflow.Application.Features.FleetFlow.Vehicles;

namespace feetflow.Application.Features.FleetFlow.Maintenance;

public record GetMaintenanceLogsQuery(int Page = 1, int PageSize = 20, bool? IsClosed = null, Guid? VehicleId = null)
    : IRequest<Result<PagedResult<MaintenanceLogDto>>>;

public class GetMaintenanceLogsQueryHandler : IRequestHandler<GetMaintenanceLogsQuery, Result<PagedResult<MaintenanceLogDto>>>
{
    private readonly IMaintenanceLogRepository _repository;

    public GetMaintenanceLogsQueryHandler(IMaintenanceLogRepository repository) => _repository = repository;

    public async Task<Result<PagedResult<MaintenanceLogDto>>> Handle(GetMaintenanceLogsQuery request, CancellationToken cancellationToken)
    {
        if (request.Page < 1) return Result<PagedResult<MaintenanceLogDto>>.Failure("Page must be >= 1.", 400);
        if (request.PageSize < 1 || request.PageSize > 100) return Result<PagedResult<MaintenanceLogDto>>.Failure("PageSize must be between 1 and 100.", 400);

        var items = await _repository.GetPagedDtoAsync(request.Page, request.PageSize, request.IsClosed, request.VehicleId, cancellationToken);
        var total = await _repository.CountAsync(request.IsClosed, request.VehicleId, cancellationToken);
        return Result<PagedResult<MaintenanceLogDto>>.Success(new PagedResult<MaintenanceLogDto>(items, total, request.Page, request.PageSize));
    }
}
