using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Analytics;

public record DashboardQuery : IRequest<Result<DashboardSnapshot>>;

public class DashboardQueryHandler : IRequestHandler<DashboardQuery, Result<DashboardSnapshot>>
{
    private readonly IAnalyticsRepository _analyticsRepository;

    public DashboardQueryHandler(IAnalyticsRepository analyticsRepository)
    {
        _analyticsRepository = analyticsRepository;
    }

    public async Task<Result<DashboardSnapshot>> Handle(DashboardQuery request, CancellationToken cancellationToken)
    {
        var snapshot = await _analyticsRepository.GetDashboardAsync(cancellationToken);
        return Result<DashboardSnapshot>.Success(snapshot);
    }
}
