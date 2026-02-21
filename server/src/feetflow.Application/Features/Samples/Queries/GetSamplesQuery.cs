using MediatR;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;

namespace feetflow.Application.Features.Samples.Queries;

public record GetSamplesQuery : IRequest<Result<IEnumerable<SampleEntity>>>;

public class GetSamplesQueryHandler : IRequestHandler<GetSamplesQuery, Result<IEnumerable<SampleEntity>>>
{
    private readonly Domain.Interfaces.IRepository<SampleEntity> _repository;

    public GetSamplesQueryHandler(Domain.Interfaces.IRepository<SampleEntity> repository)
    {
        _repository = repository;
    }

    public async Task<Result<IEnumerable<SampleEntity>>> Handle(
        GetSamplesQuery request,
        CancellationToken cancellationToken)
    {
        var samples = await _repository.GetAllAsync(cancellationToken);
        return Result<IEnumerable<SampleEntity>>.Success(samples);
    }
}
