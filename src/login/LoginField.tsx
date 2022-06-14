import './LoginField.scss';
import Text from '../store/fonts/Text';
import { useEffect, useRef, useState } from 'react';


export interface LoginFieldProps {
    label: string;
    type?: 'text' | 'password';
    maxLength?: number;
    value?: string;
    valueChange?: (value: string) => void;
}

const LoginField = (props: LoginFieldProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [ focused, setFocused ] = useState(false);
    const [ value, setValue ] = useState(() => '');
    const [ display, setDisplay ] = useState(() => '');

    const handleInput = (event) => {
        if (focused) {
            if (event.keyCode === 8) {
                // Backspace
                if (value?.length) {
                    const newValue = value.slice(0, value.length - 2);
                    setValue(newValue);
                    setDisplay(props.type === 'password' ?
                        new Array(newValue.length - 1).fill('*').join() : newValue);
                }
            } else if (!props.maxLength || value.length < props.maxLength) {
                const newValue = value + event.key;
                setValue(newValue);
                setDisplay(props.type === 'password' ?
                    new Array(newValue.length - 1).fill('*').join('') : newValue);
            }
        }
    };

    const handleClick = (event) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
            setFocused(false);
            // document.removeEventListener('keydown', handleInput, false);
        } else {
            setFocused(true);
            // document.addEventListener('keydown', handleInput, false);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleInput, false);
        document.addEventListener('mousedown', handleClick, false);

        return () => {
            document.removeEventListener('keydown', handleInput, false);
            document.removeEventListener('mousedown', handleClick, false);
        };
    }, [ wrapperRef, value, focused ]);

    return (
        <div className="rjs-login-field" ref={wrapperRef}>
            <Text font="b12_full" color={16777215}
                  dropShadow className="rjs-form-label">
                { props.label }
            </Text>

            <div className="rjs-login-input">
                <Text font="b12_full" color={16777215}
                      dropShadow className="rjs-field-input">
                    { display }
                </Text>

                { focused && (
                    <Text font="b12_full" color={16776960}
                          dropShadow className="rjs-form-caret">
                        |
                    </Text>
                ) }
            </div>
        </div>
    );
};

export default LoginField;
