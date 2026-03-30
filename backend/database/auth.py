import time
from flask import current_app, session, redirect, url_for
from authlib.integrations.flask_client import OAuth

oauth = OAuth()

def _token_expired(token:dict, leeway_seconds:int=60) -> bool:
    """Whether token is still still valid or not.
    Add a leeway tolerance to deal with clock inaccuracy.
    """
    exp_at = token.get('expires_at')
    if exp_at is None:
        return False
    return time.time() >= (exp_at - leeway_seconds)


def ensure_valid_token():
    """Return the current auth token, refreshing it if needed.
    """
    token = session.get("oidc_auth_token")
    if not token or not token.get('id_token'):
        return redirect(url_for('sso_login'))
    if _token_expired(token):
        current_app.logger.debug(f"TOKEN EXPIRED: {token}")
        refreshed = oauth.oidc.fetch_access_token(
            refresh_token=token['refresh_token'],
            grant_type='refresh_token'
        )
        session["oidc_auth_token"] = refreshed
        current_app.logger.debug(f"REFRESHED TOKEN: {refreshed}")
        token = refreshed
    return token
