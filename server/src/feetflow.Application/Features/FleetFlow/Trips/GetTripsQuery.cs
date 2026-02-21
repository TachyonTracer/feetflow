using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Trips;

public record GetTripsQuery(int Page = 1, int PageSize = 20, TripStatus? Status = null, Guid? VehicleId = null) : IRequest<Result<PagedResult<Trip>>>;

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public class GetTripsQueryHandler : IRequestHandler<GetTripsQuery, Result<PagedResult<Trip>>>
{
    private readonly ITripRepository _tripRepository;

    public GetTripsQueryHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<PagedResult<Trip>>> Handle(GetTripsQuery request, CancellationToken cancellationToken)
    {
        if (request.Page < 1) return Result<PagedResult<Trip>>.Failure("Page must be >= 1.", 400);
        if (request.PageSize < 1 || request.PageSize > 100) return Result<PagedResult<Trip>>.Failure("PageSize must be between 1 and 100.", 400);

        var items = await _tripRepository.GetPagedAsync(request.Page, request.PageSize, request.Status, request.VehicleId, cancellationToken);
        var total = await _tripRepository.CountAsync(request.Status, request.VehicleId, cancellationToken);
        return Result<PagedResult<Trip>>.Success(new PagedResult<Trip>(items, total, request.Page, request.PageSize));
    }
}
