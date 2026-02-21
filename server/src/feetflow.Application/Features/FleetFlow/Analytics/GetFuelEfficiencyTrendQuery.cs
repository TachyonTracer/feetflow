using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Analytics;

public record GetFuelEfficiencyTrendQuery(DateTime? StartDate = null, DateTime? EndDate = null) : IRequest<Result<IEnumerable<FuelEfficiencyTrendItem>>>;

public class GetFuelEfficiencyTrendQueryHandler : IRequestHandler<GetFuelEfficiencyTrendQuery, Result<IEnumerable<FuelEfficiencyTrendItem>>>
{
    private readonly IAnalyticsRepository _analyticsRepository;

    public GetFuelEfficiencyTrendQueryHandler(IAnalyticsRepository analyticsRepository)
    {
        _analyticsRepository = analyticsRepository;
    }

    public async Task<Result<IEnumerable<FuelEfficiencyTrendItem>>> Handle(GetFuelEfficiencyTrendQuery request, CancellationToken cancellationToken)
    {
        var trend = await _analyticsRepository.GetFuelEfficiencyTrendAsync(request.StartDate, request.EndDate, cancellationToken);
        return Result<IEnumerable<FuelEfficiencyTrendItem>>.Success(trend);
    }
}
