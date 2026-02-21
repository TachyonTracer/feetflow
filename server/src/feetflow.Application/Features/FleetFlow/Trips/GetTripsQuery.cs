using MediatR;
using feetflow.Application.Common;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Trips;

public record GetTripsQuery(int PageNumber = 1, int PageSize = 10, TripStatus? Status = null, Guid? VehicleId = null) : IRequest<Result<PagedResult<Trip>>>;

public class GetTripsQueryHandler : IRequestHandler<GetTripsQuery, Result<PagedResult<Trip>>>
{
    private readonly ITripRepository _tripRepository;

    public GetTripsQueryHandler(ITripRepository tripRepository)
    {
        _tripRepository = tripRepository;
    }

    public async Task<Result<PagedResult<Trip>>> Handle(GetTripsQuery request, CancellationToken cancellationToken)
    {
        var (pageNumber, pageSize) = PaginationHelper.Normalize(request.PageNumber, request.PageSize);

        var items = await _tripRepository.GetPagedAsync(pageNumber, pageSize, request.Status, request.VehicleId, cancellationToken);
        var total = await _tripRepository.CountAsync(request.Status, request.VehicleId, cancellationToken);
        return Result<PagedResult<Trip>>.Success(new PagedResult<Trip>(items, total, pageNumber, pageSize));
    }
}
