export type GlobalComponentProps = {
	id?: string;
	className?: string;
	testId?: string;
};

export type UnsavedChangesHandle = {
	name: string;
	// a translation key (not pre-translated text) so that language changes are
	// reflected without having to re-register the handle or use a getter function
	sectionNameTranslationKey: string;
	// save changes
	handleSave: () => Promise<void>;
	// function to reset component's states in a controlled way
	handleUndo: () => void;
	// true = has unsaved changes
	// false = does not have unsaved changes
	checkIfHasUnsavedChanges: () => boolean;
};
