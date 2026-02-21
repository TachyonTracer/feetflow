using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using feetflow.Domain.Enums;
using feetflow.Domain.Interfaces;
using FluentValidation;

namespace feetflow.Application.Features.FleetFlow.Drivers;

public record CreateDriverCommand(
    string FullName,
    string LicenseNumber,
    string LicenseCategory,
    DateOnly LicenseExpiry) : IRequest<Result<Driver>>;

public class CreateDriverCommandValidator : AbstractValidator<CreateDriverCommand>
{
    public CreateDriverCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.LicenseNumber).NotEmpty().MaximumLength(100);
        RuleFor(x => x.LicenseCategory).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LicenseExpiry).GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow));
    }
}

public class CreateDriverCommandHandler : IRequestHandler<CreateDriverCommand, Result<Driver>>
{
    private readonly IDriverRepository _driverRepository;

    public CreateDriverCommandHandler(IDriverRepository driverRepository)
    {
        _driverRepository = driverRepository;
    }

    public async Task<Result<Driver>> Handle(CreateDriverCommand request, CancellationToken cancellationToken)
    {
        var driver = new Driver
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            LicenseNumber = request.LicenseNumber,
            LicenseCategory = request.LicenseCategory,
            LicenseExpiry = request.LicenseExpiry,
            Status = DriverStatus.OnDuty,
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            Xmin = 0
        };
        await _driverRepository.AddAsync(driver, cancellationToken);
        return Result<Driver>.Created(driver);
    }
}
