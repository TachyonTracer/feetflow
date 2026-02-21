using MediatR;
using feetflow.Application.Common;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Maintenance;

public record GetMaintenanceLogsQuery(int PageNumber = 1, int PageSize = 10, bool? IsClosed = null, Guid? VehicleId = null)
    : IRequest<Result<PagedResult<MaintenanceLogDto>>>;

public class GetMaintenanceLogsQueryHandler : IRequestHandler<GetMaintenanceLogsQuery, Result<PagedResult<MaintenanceLogDto>>>
{
    private readonly IMaintenanceLogRepository _repository;

    public GetMaintenanceLogsQueryHandler(IMaintenanceLogRepository repository) => _repository = repository;

    public async Task<Result<PagedResult<MaintenanceLogDto>>> Handle(GetMaintenanceLogsQuery request, CancellationToken cancellationToken)
    {
        var (pageNumber, pageSize) = PaginationHelper.Normalize(request.PageNumber, request.PageSize);

        var items = await _repository.GetPagedDtoAsync(pageNumber, pageSize, request.IsClosed, request.VehicleId, cancellationToken);
        var total = await _repository.CountAsync(request.IsClosed, request.VehicleId, cancellationToken);
        return Result<PagedResult<MaintenanceLogDto>>.Success(new PagedResult<MaintenanceLogDto>(items, total, pageNumber, pageSize));
    }
}
