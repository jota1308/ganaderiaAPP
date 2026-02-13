import React from 'react';

class LotesErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error en PaginaLotes:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 rounded-lg">
          <h2 className="text-red-800 font-bold">Error en la pestaña de Lotes</h2>
          <p className="text-red-600 mt-2">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Reintentar</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LotesErrorBoundary;
