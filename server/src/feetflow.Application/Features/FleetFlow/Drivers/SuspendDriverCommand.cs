using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Drivers;

public record SuspendDriverCommand(Guid Id) : IRequest<Result<Driver>>;

public class SuspendDriverCommandValidator : AbstractValidator<SuspendDriverCommand>
{
    public SuspendDriverCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
    }
}

public class SuspendDriverCommandHandler : IRequestHandler<SuspendDriverCommand, Result<Driver>>
{
    private readonly IDriverRepository _driverRepository;

    public SuspendDriverCommandHandler(IDriverRepository driverRepository)
    {
        _driverRepository = driverRepository;
    }

    public async Task<Result<Driver>> Handle(SuspendDriverCommand request, CancellationToken cancellationToken)
    {
        var driver = await _driverRepository.GetByIdAsync(request.Id, cancellationToken);
        if (driver == null)
            return Result<Driver>.NotFound("Driver not found.");
        if (driver.Status == DriverStatus.OnTrip)
            return Result<Driver>.Failure("Cannot suspend driver who is on a trip.", 400);

        var updated = await _driverRepository.SetStatusAsync(request.Id, DriverStatus.Suspended, driver.Xmin, cancellationToken);
        if (updated == 0)
            return Result<Driver>.Conflict("Driver was modified by another user.");
        driver.Status = DriverStatus.Suspended;
        return Result<Driver>.Success(driver);
    }
}
