using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Analytics;

public record FuelEfficiencyQuery(Guid VehicleId) : IRequest<Result<decimal?>>;

public class FuelEfficiencyQueryHandler : IRequestHandler<FuelEfficiencyQuery, Result<decimal?>>
{
    private readonly IAnalyticsRepository _analyticsRepository;

    public FuelEfficiencyQueryHandler(IAnalyticsRepository analyticsRepository)
    {
        _analyticsRepository = analyticsRepository;
    }

    public async Task<Result<decimal?>> Handle(FuelEfficiencyQuery request, CancellationToken cancellationToken)
    {
        var efficiency = await _analyticsRepository.GetFuelEfficiencyAsync(request.VehicleId, cancellationToken);
        return Result<decimal?>.Success(efficiency);
    }
}
