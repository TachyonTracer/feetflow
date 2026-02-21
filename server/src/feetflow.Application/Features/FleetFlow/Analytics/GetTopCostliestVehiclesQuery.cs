using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Analytics;

public record GetTopCostliestVehiclesQuery(DateTime? StartDate = null, DateTime? EndDate = null) : IRequest<Result<IEnumerable<TopCostliestVehicleItem>>>;

public class GetTopCostliestVehiclesQueryHandler : IRequestHandler<GetTopCostliestVehiclesQuery, Result<IEnumerable<TopCostliestVehicleItem>>>
{
    private readonly IAnalyticsRepository _analyticsRepository;

    public GetTopCostliestVehiclesQueryHandler(IAnalyticsRepository analyticsRepository)
    {
        _analyticsRepository = analyticsRepository;
    }

    public async Task<Result<IEnumerable<TopCostliestVehicleItem>>> Handle(GetTopCostliestVehiclesQuery request, CancellationToken cancellationToken)
    {
        var vehicles = await _analyticsRepository.GetTopCostliestVehiclesAsync(request.StartDate, request.EndDate, cancellationToken);
        return Result<IEnumerable<TopCostliestVehicleItem>>.Success(vehicles);
    }
}
