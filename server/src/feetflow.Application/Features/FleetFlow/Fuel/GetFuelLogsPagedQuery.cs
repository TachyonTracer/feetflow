using MediatR;
using feetflow.Application.Common;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Fuel;

public record FuelLogPagedResponse(
    PagedResult<FuelLog> PagedResult,
    decimal TotalFuelCost,
    decimal TotalMiscExpense,
    int TripsCount);

public record GetFuelLogsPagedQuery(Guid? VehicleId, int PageNumber = 1, int PageSize = 10) : IRequest<Result<FuelLogPagedResponse>>;

public class GetFuelLogsPagedQueryHandler : IRequestHandler<GetFuelLogsPagedQuery, Result<FuelLogPagedResponse>>
{
    private readonly IFuelLogRepository _fuelLogRepository;

    public GetFuelLogsPagedQueryHandler(IFuelLogRepository fuelLogRepository)
    {
        _fuelLogRepository = fuelLogRepository;
    }

    public async Task<Result<FuelLogPagedResponse>> Handle(GetFuelLogsPagedQuery request, CancellationToken cancellationToken)
    {
        var (pageNumber, pageSize) = PaginationHelper.Normalize(request.PageNumber, request.PageSize);

        IReadOnlyList<FuelLog> items;
        int total;

        if (request.VehicleId.HasValue)
        {
            items = await _fuelLogRepository.GetByVehicleIdPagedAsync(request.VehicleId.Value, pageNumber, pageSize, cancellationToken);
            total = await _fuelLogRepository.CountByVehicleIdAsync(request.VehicleId.Value, cancellationToken);
        }
        else
        {
            items = await _fuelLogRepository.GetAllPagedAsync(pageNumber, pageSize, cancellationToken);
            total = await _fuelLogRepository.CountAllAsync(cancellationToken);
        }

        var (totalFuelCost, totalMiscExpense, tripsCount) = await _fuelLogRepository.GetGlobalTotalsAsync(cancellationToken);

        var pagedResult = new PagedResult<FuelLog>(items, total, pageNumber, pageSize);
        return Result<FuelLogPagedResponse>.Success(new FuelLogPagedResponse(pagedResult, totalFuelCost, totalMiscExpense, tripsCount));
    }
}
