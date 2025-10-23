"""Git operations wrapper for managing repository commits."""

import logging
from pathlib import Path
from typing import Optional, List, Tuple
import git
from git.exc import GitCommandError, InvalidGitRepositoryError


logger = logging.getLogger(__name__)


class GitOperations:
    """Wrapper for git operations."""

    def __init__(self, repo_path: str, branch: str = "main"):
        """Initialize git operations.

        Args:
            repo_path: Path to git repository
            branch: Branch name to work with

        Raises:
            InvalidGitRepositoryError: If path is not a git repository
        """
        self.repo_path = Path(repo_path).resolve()
        self.branch = branch

        try:
            self.repo = git.Repo(self.repo_path)
            logger.info(f"Initialized git repository at {self.repo_path}")
        except InvalidGitRepositoryError:
            logger.error(f"Not a git repository: {self.repo_path}")
            raise

    def get_current_branch(self) -> str:
        """Get current branch name.

        Returns:
            Current branch name
        """
        return self.repo.active_branch.name

    def has_changes(self) -> bool:
        """Check if repository has uncommitted changes.

        Returns:
            True if there are changes, False otherwise
        """
        # Check for both staged and unstaged changes
        return self.repo.is_dirty() or len(self.repo.untracked_files) > 0

    def get_status(self) -> str:
        """Get git status output.

        Returns:
            Git status string
        """
        return self.repo.git.status()

    def get_diff(self, staged: bool = True) -> str:
        """Get git diff.

        Args:
            staged: If True, get staged diff; otherwise get unstaged diff

        Returns:
            Git diff output
        """
        try:
            if staged:
                return self.repo.git.diff('--cached')
            else:
                return self.repo.git.diff()
        except GitCommandError as e:
            logger.error(f"Failed to get diff: {e}")
            return ""

    def get_changed_files(self) -> List[str]:
        """Get list of changed files.

        Returns:
            List of changed file paths
        """
        changed_files = []

        # Get modified and staged files
        changed_files.extend([item.a_path for item in self.repo.index.diff(None)])
        changed_files.extend([item.a_path for item in self.repo.index.diff('HEAD')])

        # Get untracked files
        changed_files.extend(self.repo.untracked_files)

        return list(set(changed_files))  # Remove duplicates

    def stage_all(self) -> bool:
        """Stage all changes.

        Returns:
            True if successful, False otherwise
        """
        try:
            self.repo.git.add(A=True)
            logger.info("Staged all changes")
            return True
        except GitCommandError as e:
            logger.error(f"Failed to stage changes: {e}")
            return False

    def commit(self, message: str, author_name: str = None, author_email: str = None) -> bool:
        """Create a commit with the given message.

        Args:
            message: Commit message
            author_name: Author name (optional)
            author_email: Author email (optional)

        Returns:
            True if successful, False otherwise
        """
        try:
            # Set author if provided
            author = None
            if author_name and author_email:
                author = git.Actor(author_name, author_email)

            self.repo.index.commit(message, author=author)
            logger.info(f"Created commit: {message[:50]}...")
            return True
        except GitCommandError as e:
            logger.error(f"Failed to commit: {e}")
            return False

    def push(self, remote: str = "origin", branch: str = None, retry_attempts: int = 3, retry_delay: int = 30) -> bool:
        """Push commits to remote repository.

        Args:
            remote: Remote name
            branch: Branch name (uses instance branch if not provided)
            retry_attempts: Number of retry attempts
            retry_delay: Delay between retries in seconds

        Returns:
            True if successful, False otherwise
        """
        import time

        if branch is None:
            branch = self.branch

        for attempt in range(retry_attempts):
            try:
                origin = self.repo.remote(remote)
                origin.push(branch)
                logger.info(f"Pushed to {remote}/{branch}")
                return True
            except GitCommandError as e:
                logger.warning(f"Push attempt {attempt + 1}/{retry_attempts} failed: {e}")
                if attempt < retry_attempts - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                else:
                    logger.error(f"Failed to push after {retry_attempts} attempts")
                    return False
            except Exception as e:
                logger.error(f"Unexpected error during push: {e}")
                return False

        return False

    def get_last_commit_message(self) -> Optional[str]:
        """Get the last commit message.

        Returns:
            Last commit message or None
        """
        try:
            return self.repo.head.commit.message.strip()
        except Exception as e:
            logger.error(f"Failed to get last commit message: {e}")
            return None

    def get_commit_count(self) -> int:
        """Get total number of commits.

        Returns:
            Number of commits
        """
        try:
            return len(list(self.repo.iter_commits()))
        except Exception as e:
            logger.error(f"Failed to get commit count: {e}")
            return 0

    def pull(self, remote: str = "origin", branch: str = None) -> bool:
        """Pull latest changes from remote.

        Args:
            remote: Remote name
            branch: Branch name (uses instance branch if not provided)

        Returns:
            True if successful, False otherwise
        """
        if branch is None:
            branch = self.branch

        try:
            origin = self.repo.remote(remote)
            origin.pull(branch)
            logger.info(f"Pulled from {remote}/{branch}")
            return True
        except GitCommandError as e:
            logger.error(f"Failed to pull: {e}")
            return False
