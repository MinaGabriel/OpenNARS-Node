import { ConnectorType } from './Enums';

export class Connector {
  private _is_commutative: boolean;
  private _is_product_or_image : boolean;
  private _is_single_only: boolean;
  private _is_double_only: boolean;
  private _is_multiple_only: boolean;
  private _is_temporal: boolean;
  private _is_predictive: boolean;
  private _is_concurrent: boolean;
  private _atemporal_version: ConnectorType;
  private _concurrent_version: ConnectorType;
  private _predictive_version: ConnectorType;

  constructor(public readonly type: ConnectorType) {
    // Compute once and store

    this._is_commutative = [
      ConnectorType.CONJUNCTION,
      ConnectorType.DISJUNCTION,
      ConnectorType.PARALLEL_EVENTS,
      ConnectorType.INTENSIONAL_INTERSECTION,
      ConnectorType.EXTENSIONAL_INTERSECTION,
      ConnectorType.INTENSIONAL_SET,
      ConnectorType.EXTENSIONAL_SET
    ].includes(type);

    this._is_single_only = type === ConnectorType.NEGATION;

    this._is_product_or_image = [
      ConnectorType.PRODUCT,
      ConnectorType.EXTENSIONAL_IMAGE,
      ConnectorType.INTENSIONAL_IMAGE
    ].includes(type);

    this._is_double_only = [
      ConnectorType.EXTENSIONAL_DIFFERENCE,
      ConnectorType.INTENSIONAL_DIFFERENCE
    ].includes(type);

    this._is_multiple_only = [
      ConnectorType.CONJUNCTION,
      ConnectorType.DISJUNCTION,
      ConnectorType.PARALLEL_EVENTS,
      ConnectorType.SEQUENTIAL_EVENTS,
      ConnectorType.INTENSIONAL_INTERSECTION,
      ConnectorType.EXTENSIONAL_INTERSECTION,
      ConnectorType.EXTENSIONAL_DIFFERENCE,
      ConnectorType.INTENSIONAL_DIFFERENCE,
      ConnectorType.INTENSIONAL_IMAGE,
      ConnectorType.EXTENSIONAL_IMAGE
    ].includes(type);

    this._is_temporal = [
      ConnectorType.SEQUENTIAL_EVENTS,
      ConnectorType.PARALLEL_EVENTS
    ].includes(type);

    this._is_predictive = type === ConnectorType.SEQUENTIAL_EVENTS;
    this._is_concurrent = type === ConnectorType.PARALLEL_EVENTS;

    this._atemporal_version = this._is_temporal ? ConnectorType.CONJUNCTION : type;
    this._concurrent_version = type === ConnectorType.CONJUNCTION ? ConnectorType.PARALLEL_EVENTS : type;
    this._predictive_version = type === ConnectorType.CONJUNCTION ? ConnectorType.SEQUENTIAL_EVENTS : type;
  }
 

  /** Whether this connector is commutative (order doesn't matter) */
  public get is_commutative(): boolean {
    return this._is_commutative;
  }

  public get is_product_or_image(): boolean{
    return this._is_product_or_image;
  }

  /** Whether this connector accepts only one term */
  public get is_single_only(): boolean {
    return this._is_single_only;
  }

  /** Whether this connector accepts exactly two terms */
  public get is_double_only(): boolean {
    return this._is_double_only;
  }

  /** Whether this connector requires two or more terms */
  public get is_multiple_only(): boolean {
    return this._is_multiple_only;
  }

  /** Whether this connector implies time (sequential or parallel events) */
  public get is_temporal(): boolean {
    return this._is_temporal;
  }

  /** Whether this connector is specifically predictive (sequential events) */
  public get is_predictive(): boolean {
    return this._is_predictive;
  }

  /** Whether this connector implies concurrency (parallel events) */
  public get is_concurrent(): boolean {
    return this._is_concurrent;
  }

  /** Atemporal version of this connector (e.g., &/ → &&) */
  public get atemporal_version(): ConnectorType {
    return this._atemporal_version;
  }

  /** Concurrent version of this connector (e.g., && → &|) */
  public get concurrent_version(): ConnectorType {
    return this._concurrent_version;
  }

  /** Predictive version of this connector (e.g., && → &/) */
  public get predictive_version(): ConnectorType {
    return this._predictive_version;
  }

  /** Validate number of terms allowed with this connector */
  public check_valid(len_terms: number): boolean {
    if (this._is_single_only) return len_terms === 1;
    if (this._is_double_only) return len_terms === 2;
    if (this._is_multiple_only) return len_terms > 1;
    return len_terms > 0;
  }
}
