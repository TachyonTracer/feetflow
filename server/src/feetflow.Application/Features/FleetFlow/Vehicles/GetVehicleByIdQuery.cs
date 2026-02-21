using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Interfaces;

namespace feetflow.Application.Features.FleetFlow.Vehicles;

public record GetVehicleByIdQuery(Guid Id) : IRequest<Result<Vehicle>>;

public class GetVehicleByIdQueryHandler : IRequestHandler<GetVehicleByIdQuery, Result<Vehicle>>
{
    private readonly IVehicleRepository _vehicleRepository;

    public GetVehicleByIdQueryHandler(IVehicleRepository vehicleRepository)
    {
        _vehicleRepository = vehicleRepository;
    }

    public async Task<Result<Vehicle>> Handle(GetVehicleByIdQuery request, CancellationToken cancellationToken)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(request.Id, cancellationToken);
        if (vehicle == null)
            return Result<Vehicle>.NotFound("Vehicle not found.");

        var costs = await _vehicleRepository.GetOperationalCostsAsync(request.Id, cancellationToken);
        vehicle.TotalFuelCost = costs.TotalFuel;
        vehicle.TotalMaintenanceCost = costs.TotalMaintenance;
        vehicle.TotalMiscExpense = costs.TotalMisc;

        return Result<Vehicle>.Success(vehicle);
    }
}
