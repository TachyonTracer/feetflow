using FluentAssertions;
using feetflow.Domain.Common;
using feetflow.Domain.Entities;

namespace feetflow.Domain.Tests;

public class ResultTests
{
    [Fact]
    public void Success_ShouldCreateSuccessResult()
    {
        var entity = new SampleEntity { Name = "Test" };
        var result = Result<SampleEntity>.Success(entity);

        result.IsSuccess.Should().BeTrue();
        result.Value.Should().Be(entity);
        result.Error.Should().BeNull();
        result.StatusCode.Should().Be(200);
    }

    [Fact]
    public void Failure_ShouldCreateFailureResult()
    {
        var result = Result<SampleEntity>.Failure("Something went wrong", 400);

        result.IsSuccess.Should().BeFalse();
        result.Value.Should().BeNull();
        result.Error.Should().Be("Something went wrong");
        result.StatusCode.Should().Be(400);
    }

    [Fact]
    public void NotFound_ShouldReturn404()
    {
        var result = Result<SampleEntity>.NotFound();

        result.IsSuccess.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }
}

public class BaseEntityTests
{
    [Fact]
    public void NewEntity_ShouldHaveDefaultValues()
    {
        var entity = new SampleEntity { Name = "Test" };

        entity.Id.Should().NotBeEmpty();
        entity.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        entity.UpdatedAt.Should().BeNull();
        entity.IsActive.Should().BeTrue();
    }
}
