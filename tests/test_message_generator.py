"""Tests for message generator module."""

import pytest
from unittest.mock import Mock
from src.message_generator import MessageGenerator
from src.ollama_client import OllamaClient


@pytest.fixture
def mock_ollama_client():
    """Create mock Ollama client."""
    client = Mock(spec=OllamaClient)
    return client


@pytest.fixture
def config():
    """Create test configuration."""
    return {
        'use_ollama': True,
        'message_template': 'chore: automated update - {timestamp}',
        'include_diff_context': True
    }


def test_message_generator_init(mock_ollama_client, config):
    """Test message generator initialization."""
    generator = MessageGenerator(mock_ollama_client, config)

    assert generator.ollama_client == mock_ollama_client
    assert generator.config == config
    assert generator.use_ollama is True
    assert generator.commit_counter == 0


def test_generate_with_ollama_success(mock_ollama_client, config):
    """Test successful generation with Ollama."""
    mock_ollama_client.generate.return_value = 'feat: add new feature'

    generator = MessageGenerator(mock_ollama_client, config)
    result = generator.generate(['file1.py', 'file2.py'], 'diff content', 'system prompt')

    assert result == 'feat: add new feature'
    assert generator.commit_counter == 1
    mock_ollama_client.generate.assert_called_once()


def test_generate_with_ollama_fallback(mock_ollama_client, config):
    """Test fallback to template when Ollama fails."""
    mock_ollama_client.generate.return_value = None

    generator = MessageGenerator(mock_ollama_client, config)
    result = generator.generate(['file1.py'], 'diff', 'system')

    assert 'chore: automated update' in result
    assert generator.commit_counter == 1


def test_generate_template_only(config):
    """Test generation with template only (no Ollama)."""
    generator = MessageGenerator(None, config)
    result = generator.generate(['file1.py'], 'diff', 'system')

    assert 'chore: automated update' in result


def test_sanitize_message(mock_ollama_client, config):
    """Test message sanitization."""
    generator = MessageGenerator(mock_ollama_client, config)

    # Test quote removal
    assert generator._sanitize_message('"feat: test"') == 'feat: test'
    assert generator._sanitize_message("'fix: bug'") == 'fix: bug'

    # Test multiline (takes first line)
    assert generator._sanitize_message('feat: test\nmore text') == 'feat: test'

    # Test length limit
    long_msg = 'a' * 100
    result = generator._sanitize_message(long_msg)
    assert len(result) <= 72


def test_validate_message(mock_ollama_client, config):
    """Test message validation."""
    generator = MessageGenerator(mock_ollama_client, config)

    # Valid messages
    assert generator._validate_message('feat: add new feature') is True
    assert generator._validate_message('fix: resolve bug') is True
    assert generator._validate_message('chore: update dependencies') is True

    # Invalid messages
    assert generator._validate_message('') is False
    assert generator._validate_message('abc') is False
    assert generator._validate_message('invalid: ') is False


def test_validate_message_without_colon(mock_ollama_client, config):
    """Test validation of messages without conventional format."""
    generator = MessageGenerator(mock_ollama_client, config)

    # Should accept if long enough
    assert generator._validate_message('Update documentation for API') is True

    # Should reject if too short
    assert generator._validate_message('Update') is False


def test_set_ollama_enabled(mock_ollama_client, config):
    """Test enabling/disabling Ollama."""
    generator = MessageGenerator(mock_ollama_client, config)

    assert generator.use_ollama is True

    generator.set_ollama_enabled(False)
    assert generator.use_ollama is False

    generator.set_ollama_enabled(True)
    assert generator.use_ollama is True


def test_counter_increment(mock_ollama_client, config):
    """Test commit counter increments."""
    mock_ollama_client.generate.return_value = 'feat: test'

    generator = MessageGenerator(mock_ollama_client, config)

    assert generator.commit_counter == 0

    generator.generate([], '', '')
    assert generator.commit_counter == 1

    generator.generate([], '', '')
    assert generator.commit_counter == 2


def test_activity_types_exist(mock_ollama_client, config):
    """Test that activity types are defined."""
    generator = MessageGenerator(mock_ollama_client, config)

    assert hasattr(generator, 'ACTIVITY_TYPES')
    assert len(generator.ACTIVITY_TYPES) > 0
    assert 'feat' in generator.ACTIVITY_TYPES
    assert 'fix' in generator.ACTIVITY_TYPES
