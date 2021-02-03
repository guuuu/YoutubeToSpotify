import os
import google.oauth2.credentials
import google_auth_oauthlib.flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google_auth_oauthlib.flow import InstalledAppFlow

def clear(): return os.system('cls')

class Youtube:
    CLIENT_SECRETS_FILE = "client_secret.json"
    SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']
    API_SERVICE_NAME = 'youtube'
    API_VERSION = 'v3'

    def __init__(self):
        pass

    def get_authenticated_service(self):
        flow = InstalledAppFlow.from_client_secrets_file(Youtube.CLIENT_SECRETS_FILE, Youtube.SCOPES)
        credentials = flow.run_console()
        return build(Youtube.API_SERVICE_NAME, Youtube.API_VERSION, credentials=credentials)


    def print_response(self, response):
        print(response)

    # Build a resource based on a list of
    # properties given as key-value pairs.
    # Leave properties with empty values out
    # of the inserted resource.

    def build_resource(self, properties):
        resource = {}
        for p in properties:
            # Given a key like "snippet.title", split into
            # "snippet" and "title", where
            # "snippet" will be an object and "title"
            # will be a property in that object.
            prop_array = p.split('.')
            ref = resource
            for pa in range(0, len(prop_array)):
                is_array = False
                key = prop_array[pa]

                # For properties that have array values,
                # convert a name like "snippet.tags[]" to
                # snippet.tags, and set a flag to handle
                # the value as an array.
                if key[-2:] == '[]':
                    key = key[0:len(key)-2:]
                    is_array = True

                if pa == (len(prop_array) - 1):
                    # Leave properties without values
                    # out of inserted resource.
                    if properties[p]:
                        if is_array:
                            ref[key] = properties[p].split(', ')
                        else:
                            ref[key] = properties[p]
                elif key not in ref:
                    # For example, the property is "snippet.title", but the resource does
                    # not yet have a "snippet" object. Create the snippet object here.
                    # Setting "ref = ref[key]" means that in the next time through the
                    # "for pa in range ..." loop, we will be setting a property in the
                    # resource's "snippet" object.
                    ref[key] = {}
                    ref = ref[key]
                else:
                    # For example, the property is "snippet.description",
                    # and the resource already has a "snippet" object.
                    ref = ref[key]
        return resource

    # Remove keyword arguments that are not set


    def remove_empty_kwargs(self, **kwargs):
        good_kwargs = {}
        if kwargs is not None:
            for key, value in kwargs.items():
                if value:
                    good_kwargs[key] = value
        return good_kwargs


    def playlists_list_by_channel_id(self, client, **kwargs):
        kwargs = Youtube.remove_empty_kwargs(self=None, **kwargs)

        response = client.playlists().list(*kwargs).execute()

        return Youtube.print_response(self=None,response=response)

    def run(self):
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        client = Youtube.get_authenticated_service(self=None)

        Youtube.playlists_list_by_channel_id(None, client,part='snippet, contentDetails', channelId='UChdiqWdPC6eipuVNyeFZkMw', maxResults=25)


if __name__ == '__main__':
    Youtube.run(self=None)