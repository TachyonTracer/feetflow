using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Fuel;

public record GetFuelLogsQuery(Guid? VehicleId = null) : IRequest<Result<IReadOnlyList<FuelLog>>>;

public class GetFuelLogsQueryHandler : IRequestHandler<GetFuelLogsQuery, Result<IReadOnlyList<FuelLog>>>
{
    private readonly IFuelLogRepository _fuelLogRepository;

    public GetFuelLogsQueryHandler(IFuelLogRepository fuelLogRepository)
    {
        _fuelLogRepository = fuelLogRepository;
    }

    public async Task<Result<IReadOnlyList<FuelLog>>> Handle(GetFuelLogsQuery request, CancellationToken cancellationToken)
    {
        if (!request.VehicleId.HasValue)
            return Result<IReadOnlyList<FuelLog>>.Failure("VehicleId is required.", 400);

        var list = await _fuelLogRepository.GetByVehicleIdAsync(request.VehicleId.Value, cancellationToken);
        return Result<IReadOnlyList<FuelLog>>.Success(list);
    }
}
