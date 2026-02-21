using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Vehicles;

public record GetVehiclesQuery(int Page = 1, int PageSize = 20, VehicleStatus? Status = null, bool IncludeDeleted = false) : IRequest<Result<PagedResult<Vehicle>>>;

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public class GetVehiclesQueryHandler : IRequestHandler<GetVehiclesQuery, Result<PagedResult<Vehicle>>>
{
    private readonly IVehicleRepository _vehicleRepository;

    public GetVehiclesQueryHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<Result<PagedResult<Vehicle>>> Handle(GetVehiclesQuery request, CancellationToken cancellationToken)
    {
        if (request.Page < 1) return Result<PagedResult<Vehicle>>.Failure("Page must be >= 1.", 400);
        if (request.PageSize < 1 || request.PageSize > 100) return Result<PagedResult<Vehicle>>.Failure("PageSize must be between 1 and 100.", 400);

        var items = await _vehicleRepository.GetPagedAsync(request.Page, request.PageSize, request.Status, request.IncludeDeleted, cancellationToken);
        var total = await _vehicleRepository.CountAsync(request.Status, request.IncludeDeleted, cancellationToken);
        return Result<PagedResult<Vehicle>>.Success(new PagedResult<Vehicle>(items, total, request.Page, request.PageSize));
    }
}
