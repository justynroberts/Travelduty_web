"""Ollama API client for generating commit messages."""

import requests
import logging
from typing import Optional, Dict, Any


logger = logging.getLogger(__name__)


class OllamaClient:
    """Client for interacting with Ollama API."""

    def __init__(self, url: str, model: str, timeout: int = 30, max_tokens: int = 100):
        """Initialize Ollama client.

        Args:
            url: Ollama API URL
            model: Model name to use
            timeout: Request timeout in seconds
            max_tokens: Maximum tokens to generate
        """
        self.url = url.rstrip('/')
        self.model = model
        self.timeout = timeout
        self.max_tokens = max_tokens

    def generate(self, prompt: str, system_prompt: str = "") -> Optional[str]:
        """Generate text using Ollama.

        Args:
            prompt: User prompt
            system_prompt: System prompt for context

        Returns:
            Generated text or None if failed
        """
        try:
            endpoint = f"{self.url}/api/generate"
            payload = {
                "model": self.model,
                "prompt": prompt,
                "system": system_prompt,
                "stream": False,
                "options": {
                    "num_predict": self.max_tokens,
                    "temperature": 0.7,
                }
            }

            logger.info(f"Sending request to Ollama: {endpoint}")
            logger.debug(f"Payload: {payload}")

            response = requests.post(
                endpoint,
                json=payload,
                timeout=self.timeout
            )

            response.raise_for_status()
            result = response.json()

            if 'response' in result:
                generated_text = result['response'].strip()
                logger.info(f"Ollama generated: {generated_text}")
                return generated_text
            else:
                logger.error(f"Unexpected response format: {result}")
                return None

        except requests.exceptions.Timeout:
            logger.error(f"Ollama request timed out after {self.timeout} seconds")
            return None
        except requests.exceptions.ConnectionError:
            logger.error(f"Could not connect to Ollama at {self.url}")
            return None
        except requests.exceptions.HTTPError as e:
            logger.error(f"Ollama HTTP error: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error calling Ollama: {e}")
            return None

    def health_check(self) -> bool:
        """Check if Ollama is available.

        Returns:
            True if Ollama is available, False otherwise
        """
        try:
            response = requests.get(
                f"{self.url}/api/tags",
                timeout=5
            )
            response.raise_for_status()
            logger.info("Ollama health check passed")
            return True
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
            return False

    def get_models(self) -> Optional[list]:
        """Get list of available models.

        Returns:
            List of model names or None if failed
        """
        try:
            response = requests.get(
                f"{self.url}/api/tags",
                timeout=5
            )
            response.raise_for_status()
            data = response.json()

            if 'models' in data:
                models = [model['name'] for model in data['models']]
                logger.info(f"Available Ollama models: {models}")
                return models
            return None
        except Exception as e:
            logger.error(f"Failed to get Ollama models: {e}")
            return None
