import React from 'react';
import styled from 'styled-components';

interface AnimatedBlobCardProps {
    children?: React.ReactNode;
    className?: string;
}

const AnimatedBlobCard: React.FC<AnimatedBlobCardProps> = ({ children, className }) => {
    return (
        <StyledWrapper className={className}>
            <div className="card">
                <div className="bg">
                    {children}
                </div>
                <div className="blob" />
                <div className="blob" />
            </div>
        </StyledWrapper>
    );
}

const StyledWrapper = styled.div`
  width: 100%;
  height: 100%;

  .card {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 14px;
    z-index: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 20px 20px 60px #bebebe, -20px -20px 60px #ffffff;
    background: #f9fafb;
  }

  /* The content container (foreground) */
  .bg {
    position: absolute;
    top: 15px;
    left: 15px;
    right: 15px;
    bottom: 15px;
    z-index: 2;
    background: rgba(255, 255, 255, .95);
    backdrop-filter: blur(24px);
    border-radius: 10px;
    overflow: hidden;
    outline: 6px solid white;
    
    /* Ensure content fills this */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .blob {
    position: absolute;
    z-index: 1;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background-color: #b31515ff;
    opacity: 1;
    animation: blob-bounce 5s infinite linear;
    /* Center the blob on its coordinate */
    transform: translate(-50%, -50%);
  }

  .blob:nth-child(2) {
    animation-delay: -1.25s; /* Starts at 25% (Top-Right) */
  }

  .blob:nth-child(3) {
    animation-delay: -3.75s; /* Starts at 75% (Bottom-Left) */
  }

  @keyframes blob-bounce {
    0% {
      top: 0;
      left: 0;
    }
    25% {
      top: 0;
      left: 100%;
    }
    50% {
      top: 100%;
      left: 100%;
    }
    75% {
      top: 100%;
      left: 0;
    }
    100% {
      top: 0;
      left: 0;
    }
  }`;

export default AnimatedBlobCard;
