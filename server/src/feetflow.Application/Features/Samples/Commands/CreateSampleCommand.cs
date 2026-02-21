using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;
using FluentValidation;

namespace feetflow.Application.Features.Samples.Commands;

public record CreateSampleCommand(string Name, string? Description) : IRequest<Result<SampleEntity>>;

public class CreateSampleCommandValidator : AbstractValidator<CreateSampleCommand>
{
    public CreateSampleCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters");
    }
}

public class CreateSampleCommandHandler : IRequestHandler<CreateSampleCommand, Result<SampleEntity>>
{
    private readonly Domain.Interfaces.IRepository<SampleEntity> _repository;

    public CreateSampleCommandHandler(Domain.Interfaces.IRepository<SampleEntity> repository)
    {
        _repository = repository;
    }

    public async Task<Result<SampleEntity>> Handle(
        CreateSampleCommand request,
        CancellationToken cancellationToken)
    {
        var entity = new SampleEntity
        {
            Name = request.Name,
            Description = request.Description
        };

        var id = await _repository.AddAsync(entity, cancellationToken);
        entity.Id = id;

        return Result<SampleEntity>.Created(entity);
    }
}
