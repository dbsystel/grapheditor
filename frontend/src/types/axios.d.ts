import 'axios'; // ensures this file is a module AND that the real axios types are loaded before augmenting
import { StoppableRequest } from 'src/models/stoppable-request';

declare module 'axios' {
	interface AxiosRequestConfig {
		// please prefix all custom configuration properties with "application" to prevent possible
		// axios properties name collision (don't create a namespace object, it requires more work to
		// deal with it)
		applicationLoadingRequestId?: string;
		applicationStoppableRequest?: StoppableRequest;
	}
}
