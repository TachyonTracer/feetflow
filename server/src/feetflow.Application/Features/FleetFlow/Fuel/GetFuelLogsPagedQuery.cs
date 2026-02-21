using MediatR;
using feetflow.Application.Common;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Fuel;

public record GetFuelLogsPagedQuery(Guid VehicleId, int PageNumber = 1, int PageSize = 10) : IRequest<Result<PagedResult<FuelLog>>>;

public class GetFuelLogsPagedQueryHandler : IRequestHandler<GetFuelLogsPagedQuery, Result<PagedResult<FuelLog>>>
{
    private readonly IFuelLogRepository _fuelLogRepository;

    public GetFuelLogsPagedQueryHandler(IFuelLogRepository fuelLogRepository)
    {
        _fuelLogRepository = fuelLogRepository;
    }

    public async Task<Result<PagedResult<FuelLog>>> Handle(GetFuelLogsPagedQuery request, CancellationToken cancellationToken)
    {
        var (pageNumber, pageSize) = PaginationHelper.Normalize(request.PageNumber, request.PageSize);

        var items = await _fuelLogRepository.GetByVehicleIdPagedAsync(request.VehicleId, pageNumber, pageSize, cancellationToken);
        var total = await _fuelLogRepository.CountByVehicleIdAsync(request.VehicleId, cancellationToken);
        return Result<PagedResult<FuelLog>>.Success(new PagedResult<FuelLog>(items, total, pageNumber, pageSize));
    }
}
