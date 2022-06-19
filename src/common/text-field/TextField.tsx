import './TextField.scss';
import Text from '../../store/fonts/Text';
import { useEffect, useRef, useState } from 'react';


let textFieldId: number = 0;

const validCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"£$%^&*()-_=+[{]};:\'@#~,<.>/?\\| ';

export interface TextFieldProps {
    label: string;
    id?: string;
    type?: 'text' | 'password';
    maxLength?: number;
    value?: string;
    valueChange?: (value: string) => void;
    className?: string;
    autoFocus?: boolean;
    tabIndex?: number;
    onEnter?: () => void;
}

const TextField = (props: TextFieldProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [ id, setId ] = useState(() =>
        props.id ? props.id : `rjs-text-field-${textFieldId++}`);
    const [ focused, setFocused ] = useState(false);
    const [ value, setValue ] = useState(() => '');
    const [ display, setDisplay ] = useState(() => '');

    const onFocus = () => {
        if (!focused) {
            setFocused(true);
        }
    };

    const onBlur = () => {
        if (focused) {
            setFocused(false);
        }
    }

    const updateValue = (newValue: string) => {
        setValue(newValue);
        setDisplay(props.type === 'password' ?
            new Array(newValue.length).fill('*').join('') : newValue);
    };

    const handleInput = (event) => {
        if (focused) {
            if (event.keyCode === 8) {
                // Backspace
                if(value?.length) {
                    const newValue = value.slice(0, value.length - 1);
                    updateValue(newValue);
                }
            } else if (event.keyCode === 13) {
                // Enter
                props.onEnter?.();
                setFocused(false);
            } else if(validCharacters.indexOf(event.key) !== -1) {
                if (!props.maxLength || value.length < props.maxLength) {
                    const newValue = value + (event.shiftKey ? event.key.toUpperCase() : event.key);
                    updateValue(newValue);
                }
            } else {
                console.warn(`Unhandled character: ${event.keyCode} ${event.key}`);
            }
        }
    };

    const handleClick = (event) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
            setFocused(false);
        } else {
            setFocused(true);
        }
    };

    useEffect(() => {
        setId(props.id ? props.id : `rjs-text-field-${textFieldId++}`);
    }, [ props.id ]);

    useEffect(() => {
        if (props.autoFocus) {
            setFocused(true);
        }

        if (props.value?.length) {
            updateValue(props.value);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleInput, false);
        document.addEventListener('mousedown', handleClick, false);

        return () => {
            document.removeEventListener('keydown', handleInput, false);
            document.removeEventListener('mousedown', handleClick, false);
        };
    }, [ wrapperRef, value, focused ]);

    return (
        <div className={`rjs-text-field${props.className ? ` ${props.className}` : ''}`}
             ref={wrapperRef} id={id} tabIndex={props.tabIndex} onFocus={onFocus} onBlur={onBlur}>
            <Text font="b12_full" color={16777215}
                  dropShadow className="rjs-form-label">
                { props.label }
            </Text>

            <div className="rjs-input-container">
                <Text font="b12_full" color={16777215}
                      dropShadow className="rjs-input">
                    { display }
                </Text>

                { focused && (
                    <Text font="b12_full" color={16776960}
                          dropShadow className="rjs-caret">
                        |
                    </Text>
                ) }
            </div>
        </div>
    );
};

export default TextField;
