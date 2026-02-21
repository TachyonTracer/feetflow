using MediatR;
using feetflow.Application.Common;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Vehicles;

public record GetVehiclesQuery(int PageNumber = 1, int PageSize = 10, VehicleStatus? Status = null, bool IncludeDeleted = false) : IRequest<Result<PagedResult<Vehicle>>>;

public class GetVehiclesQueryHandler : IRequestHandler<GetVehiclesQuery, Result<PagedResult<Vehicle>>>
{
    private readonly IVehicleRepository _vehicleRepository;

    public GetVehiclesQueryHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<Result<PagedResult<Vehicle>>> Handle(GetVehiclesQuery request, CancellationToken cancellationToken)
    {
        var (pageNumber, pageSize) = PaginationHelper.Normalize(request.PageNumber, request.PageSize);

        var items = await _vehicleRepository.GetPagedAsync(pageNumber, pageSize, request.Status, request.IncludeDeleted, cancellationToken);
        var total = await _vehicleRepository.CountAsync(request.Status, request.IncludeDeleted, cancellationToken);
        return Result<PagedResult<Vehicle>>.Success(new PagedResult<Vehicle>(items, total, pageNumber, pageSize));
    }
}
