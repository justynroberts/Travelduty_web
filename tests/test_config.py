"""Tests for configuration module."""

import pytest
import os
from pathlib import Path
from src.config import Config


def test_config_load():
    """Test configuration loading."""
    config = Config('config/config.yaml')
    assert config.config is not None
    assert 'repositories' in config.config
    assert 'schedule' in config.config


def test_config_get():
    """Test getting configuration values."""
    config = Config('config/config.yaml')

    # Test simple key
    assert config.get('schedule.base_interval') == 600

    # Test nested key
    assert config.get('ollama.url') == 'http://oracle.local:11434'

    # Test default value
    assert config.get('nonexistent.key', 'default') == 'default'


def test_get_repositories():
    """Test getting repository configurations."""
    config = Config('config/config.yaml')
    repos = config.get_repositories()

    assert isinstance(repos, list)
    assert len(repos) > 0
    assert 'path' in repos[0]
    assert 'branch' in repos[0]


def test_get_schedule_config():
    """Test getting schedule configuration."""
    config = Config('config/config.yaml')
    schedule = config.get_schedule_config()

    assert 'base_interval' in schedule
    assert 'jitter_range' in schedule
    assert schedule['base_interval'] == 600
    assert schedule['jitter_range'] == 50


def test_get_ollama_config():
    """Test getting Ollama configuration."""
    config = Config('config/config.yaml')
    ollama = config.get_ollama_config()

    assert 'enabled' in ollama
    assert 'url' in ollama
    assert 'model' in ollama
    assert ollama['enabled'] is True


def test_get_commit_config():
    """Test getting commit configuration."""
    config = Config('config/config.yaml')
    commit = config.get_commit_config()

    assert 'use_ollama' in commit
    assert 'message_template' in commit
    assert 'author_name' in commit
    assert 'author_email' in commit


def test_get_push_config():
    """Test getting push configuration."""
    config = Config('config/config.yaml')
    push = config.get_push_config()

    assert 'enabled' in push
    assert 'retry_attempts' in push
    assert 'retry_delay' in push


def test_get_logging_config():
    """Test getting logging configuration."""
    config = Config('config/config.yaml')
    logging = config.get_logging_config()

    assert 'level' in logging
    assert 'file' in logging
