using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Analytics;

public record VehicleRoiQuery(Guid VehicleId) : IRequest<Result<VehicleRoiResult>>;

public class VehicleRoiQueryHandler : IRequestHandler<VehicleRoiQuery, Result<VehicleRoiResult>>
{
    private readonly IAnalyticsRepository _analyticsRepository;

    public VehicleRoiQueryHandler(IAnalyticsRepository analyticsRepository)
    {
        _analyticsRepository = analyticsRepository;
    }

    public async Task<Result<VehicleRoiResult>> Handle(VehicleRoiQuery request, CancellationToken cancellationToken)
    {
        var result = await _analyticsRepository.GetVehicleRoiAsync(request.VehicleId, cancellationToken);
        return result == null ? Result<VehicleRoiResult>.NotFound("Vehicle not found.") : Result<VehicleRoiResult>.Success(result);
    }
}
