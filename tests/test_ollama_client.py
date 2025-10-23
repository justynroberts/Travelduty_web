"""Tests for Ollama client module."""

import pytest
from unittest.mock import Mock, patch
from src.ollama_client import OllamaClient


@pytest.fixture
def ollama_client():
    """Create Ollama client for testing."""
    return OllamaClient(
        url='http://oracle.local:11434',
        model='llama3.2:latest',
        timeout=30,
        max_tokens=100
    )


def test_ollama_client_init(ollama_client):
    """Test Ollama client initialization."""
    assert ollama_client.url == 'http://oracle.local:11434'
    assert ollama_client.model == 'llama3.2:latest'
    assert ollama_client.timeout == 30
    assert ollama_client.max_tokens == 100


def test_ollama_client_url_strip(ollama_client):
    """Test URL trailing slash is stripped."""
    client = OllamaClient('http://oracle.local:11434/', 'test-model')
    assert client.url == 'http://oracle.local:11434'


@patch('src.ollama_client.requests.post')
def test_generate_success(mock_post, ollama_client):
    """Test successful text generation."""
    # Mock successful response
    mock_response = Mock()
    mock_response.json.return_value = {
        'response': 'feat: add new feature'
    }
    mock_response.raise_for_status = Mock()
    mock_post.return_value = mock_response

    result = ollama_client.generate('test prompt', 'system prompt')

    assert result == 'feat: add new feature'
    mock_post.assert_called_once()


@patch('src.ollama_client.requests.post')
def test_generate_timeout(mock_post, ollama_client):
    """Test generation with timeout."""
    mock_post.side_effect = Exception("Timeout")

    result = ollama_client.generate('test prompt')

    assert result is None


@patch('src.ollama_client.requests.post')
def test_generate_whitespace_strip(mock_post, ollama_client):
    """Test that generated text is stripped of whitespace."""
    mock_response = Mock()
    mock_response.json.return_value = {
        'response': '  fix: bug fix  \n'
    }
    mock_response.raise_for_status = Mock()
    mock_post.return_value = mock_response

    result = ollama_client.generate('test prompt')

    assert result == 'fix: bug fix'


@patch('src.ollama_client.requests.get')
def test_health_check_success(mock_get, ollama_client):
    """Test successful health check."""
    mock_response = Mock()
    mock_response.raise_for_status = Mock()
    mock_get.return_value = mock_response

    result = ollama_client.health_check()

    assert result is True


@patch('src.ollama_client.requests.get')
def test_health_check_failure(mock_get, ollama_client):
    """Test failed health check."""
    mock_get.side_effect = Exception("Connection error")

    result = ollama_client.health_check()

    assert result is False


@patch('src.ollama_client.requests.get')
def test_get_models_success(mock_get, ollama_client):
    """Test getting available models."""
    mock_response = Mock()
    mock_response.json.return_value = {
        'models': [
            {'name': 'llama3.2:latest'},
            {'name': 'codellama:latest'}
        ]
    }
    mock_response.raise_for_status = Mock()
    mock_get.return_value = mock_response

    result = ollama_client.get_models()

    assert result == ['llama3.2:latest', 'codellama:latest']


@patch('src.ollama_client.requests.get')
def test_get_models_failure(mock_get, ollama_client):
    """Test getting models with error."""
    mock_get.side_effect = Exception("Error")

    result = ollama_client.get_models()

    assert result is None
