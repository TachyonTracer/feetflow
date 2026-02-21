using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Analytics;

public record GetFleetFinancialSummaryQuery(DateTime? StartDate = null, DateTime? EndDate = null) : IRequest<Result<FleetFinancialSummaryResult>>;

public class GetFleetFinancialSummaryQueryHandler : IRequestHandler<GetFleetFinancialSummaryQuery, Result<FleetFinancialSummaryResult>>
{
    private readonly IAnalyticsRepository _analyticsRepository;

    public GetFleetFinancialSummaryQueryHandler(IAnalyticsRepository analyticsRepository)
    {
        _analyticsRepository = analyticsRepository;
    }

    public async Task<Result<FleetFinancialSummaryResult>> Handle(GetFleetFinancialSummaryQuery request, CancellationToken cancellationToken)
    {
        var summary = await _analyticsRepository.GetFleetFinancialSummaryAsync(request.StartDate, request.EndDate, cancellationToken);
        return Result<FleetFinancialSummaryResult>.Success(summary);
    }
}
